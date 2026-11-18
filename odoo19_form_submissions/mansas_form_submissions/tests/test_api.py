import json

from odoo.tests import HttpCase, tagged

from .common import good_submission

URL = '/api/mansas/v1/form-submissions'


@tagged('post_install', '-at_install', 'mansas_form_submissions')
class TestSubmissionApi(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.key_rec = cls.env['mansas.form.api.key'].create({
            'name': 'mansasmoguls.com', 'website_url': 'https://mansasmoguls.com'})
        action = cls.key_rec.action_generate_key()
        cls.token = action['context']['default_key']
        cls.Submission = cls.env['mansas.form.submission'].with_context(active_test=False)

    def post(self, body, token=None, content_type='application/json'):
        headers = {'Content-Type': content_type}
        if token is not False:
            headers['Authorization'] = f'Bearer {token or self.token}'
        data = body if isinstance(body, (str, bytes)) else json.dumps(body)
        return self.url_open(URL, data=data, headers=headers)

    def envelope(self, **over):
        return {'submission': good_submission(**over), 'meta': {
            'source_url': 'https://mansasmoguls.com/', 'client_ip_hash': 'b' * 64, 'user_agent': 'test'}}

    def test_key_is_stored_hashed(self):
        self.assertTrue(self.token.startswith('mmfs_'))
        self.assertNotEqual(self.key_rec.sudo().key_hash, self.token)
        self.assertEqual(len(self.key_rec.sudo().key_hash), 64)

    def test_create_and_map_fields(self):
        env = self.envelope(contact='phone', phone='+971 50 123 4567',
                            services=['premium-websites', 'ai-agents', 'brand-new-service'])
        r = self.post(env)
        self.assertEqual(r.status_code, 201, r.text)
        body = r.json()
        self.assertTrue(body['ok'])
        rec = self.Submission.browse(body['id'])
        self.assertEqual(rec.name, body['reference'])
        self.assertTrue(rec.name.startswith('WEB/'))
        self.assertEqual(rec.contact_name, 'Amina Rahman')
        self.assertEqual(rec.email, 'amina@example.com')
        self.assertEqual(rec.company, 'Example Co')
        self.assertEqual(rec.preferred_contact, 'phone')
        self.assertEqual(rec.phone, '+971 50 123 4567')
        self.assertEqual(rec.budget, '25k_75k')
        self.assertEqual(set(rec.service_ids.mapped('slug')), {'premium-websites', 'ai-agents', 'brand-new-service'})
        self.assertEqual(rec.service_ids.filtered(lambda s: s.slug == 'ai-agents').name, 'AI agents')
        self.assertEqual(rec.utm_source, 'linkedin')
        self.assertEqual(rec.landing_path, '/')
        self.assertEqual(rec.source_website, 'mansasmoguls.com')
        self.assertEqual(rec.sudo().client_ip_hash, 'b' * 64)
        self.assertEqual(rec.api_key_id, self.key_rec)
        self.assertEqual(rec.state, 'new')
        self.assertTrue(rec.submitted_at)
        self.assertEqual(json.loads(rec.raw_payload)['submissionId'], env['submission']['submissionId'])

    def test_idempotent_retry(self):
        env = self.envelope()
        self.assertEqual(self.post(env).status_code, 201)
        r = self.post(env)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()['duplicate'])
        self.assertEqual(self.Submission.search_count(
            [('submission_id', '=', env['submission']['submissionId'])]), 1)

    def test_auth(self):
        self.assertEqual(self.post(self.envelope(), token=False).status_code, 401)
        self.assertEqual(self.post(self.envelope(), token='mmfs_000000000000_wrong').status_code, 401)
        self.assertEqual(self.post(self.envelope(), token=self.token[:-1] + 'x').status_code, 401)
        r = self.post(self.envelope(), token=False)
        self.assertIn('Bearer', r.headers.get('WWW-Authenticate', ''))
        self.key_rec.active = False
        self.assertEqual(self.post(self.envelope()).status_code, 401)
        self.key_rec.active = True

    def test_rotation_invalidates_old_key(self):
        old = self.token
        new = self.key_rec.action_generate_key()['context']['default_key']
        self.assertEqual(self.post(self.envelope(), token=old).status_code, 401)
        self.assertEqual(self.post(self.envelope(), token=new).status_code, 201)
        # The rotation is rolled back with this test, so other tests keep using self.token.

    def test_transport_errors(self):
        self.assertEqual(self.post(self.envelope(), content_type='text/plain').status_code, 415)
        self.assertEqual(self.post('{not json').status_code, 400)
        self.assertEqual(self.post('x' * (17 * 1024)).status_code, 413)

    def test_validation_errors(self):
        r = self.post(self.envelope(email='nope', description='short'))
        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()['code'], 'invalid')
        self.assertEqual(set(r.json()['errors']), {'email', 'description'})
        self.assertEqual(self.post(good_submission()).status_code, 422)  # missing envelope

    def test_spam_is_acknowledged_but_not_stored(self):
        before = self.Submission.search_count([])
        r = self.post(self.envelope(website='http://spam.example'))
        self.assertEqual(r.status_code, 202)
        self.assertTrue(r.json()['ok'])
        r = self.post(self.envelope(startedAt=0))
        self.assertEqual(r.status_code, 202)
        self.assertEqual(self.Submission.search_count([]), before)

    def test_ip_rate_limit(self):
        self.env['ir.config_parameter'].sudo().set_param(
            'mansas_form_submissions.ip_rate_limit_per_minute', '2')
        meta = {'client_ip_hash': 'c' * 64}
        codes = [self.post({'submission': good_submission(), 'meta': meta}).status_code for _i in range(3)]
        self.assertEqual(codes, [201, 201, 429])
        # A different visitor is not affected.
        r = self.post({'submission': good_submission(), 'meta': {'client_ip_hash': 'd' * 64}})
        self.assertEqual(r.status_code, 201)

    def test_key_rate_limit(self):
        self.key_rec.rate_limit_per_minute = 1
        self.assertEqual(self.post({'submission': good_submission()}).status_code, 201)
        r = self.post({'submission': good_submission()})
        self.assertEqual(r.status_code, 429)
        self.assertEqual(r.headers.get('Retry-After'), '60')
        self.key_rec.rate_limit_per_minute = 60

    def test_get_not_allowed_and_ping(self):
        self.assertEqual(self.url_open(URL).status_code, 405)
        r = self.url_open('/api/mansas/v1/ping', headers={'Authorization': f'Bearer {self.token}'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['website'], 'mansasmoguls.com')
        self.assertEqual(self.url_open('/api/mansas/v1/ping').status_code, 401)

    def test_backend_workflow(self):
        rec = self.Submission.browse(self.post(self.envelope()).json()['id'])
        rec.action_start()
        self.assertEqual(rec.state, 'in_progress')
        self.assertEqual(rec.user_id, self.env.user)
        rec.action_mark_replied()
        rec.action_close()
        self.assertEqual(rec.state, 'closed')
        rec.action_reset()
        self.assertEqual(rec.state, 'new')
