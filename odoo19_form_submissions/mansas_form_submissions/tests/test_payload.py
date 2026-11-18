from odoo.tests import BaseCase, tagged

from ..lib.payload import MIN_FILL_MS, PayloadError, check_spam, parse_envelope, parse_submission
from .common import good_submission

NOW = 1_800_000_000_000


@tagged('post_install', '-at_install', 'mansas_form_submissions')
class TestPayload(BaseCase):

    def assertInvalid(self, raw, field):
        with self.assertRaises(PayloadError) as cm:
            parse_submission(raw)
        self.assertIn(field, cm.exception.errors)

    def test_valid_and_normalised(self):
        s = parse_submission(good_submission(name='  Amina Rahman ', email=' Amina@Example.com '))
        self.assertEqual(s['name'], 'Amina Rahman')
        self.assertEqual(s['email'], 'amina@example.com')
        self.assertEqual(s['budget_key'], '25k_75k')
        self.assertEqual(s['attribution'], {'utm_source': 'linkedin', 'landing_path': '/'})

    def test_rejects_unknown_keys_and_non_objects(self):
        self.assertInvalid(good_submission(isAdmin=True), '_form')
        self.assertInvalid([1], '_form')
        self.assertInvalid(None, '_form')

    def test_field_rules_match_website(self):
        self.assertInvalid(good_submission(name='A'), 'name')
        self.assertInvalid(good_submission(name='x' * 121), 'name')
        self.assertInvalid(good_submission(email='not-an-email'), 'email')
        self.assertInvalid(good_submission(company='x' * 161), 'company')
        self.assertInvalid(good_submission(services=[]), 'services')
        self.assertInvalid(good_submission(services=['Not A Slug!']), 'services')
        self.assertInvalid(good_submission(description='too short'), 'description')
        self.assertInvalid(good_submission(description='x' * 4001), 'description')
        self.assertInvalid(good_submission(budget='A million'), 'budget')
        self.assertInvalid(good_submission(contact='fax'), 'contact')
        self.assertInvalid(good_submission(contact='phone', phone=''), 'phone')
        self.assertInvalid(good_submission(submissionId='abc'), '_form')

    def test_defaults_and_phone_handling(self):
        s = parse_submission(good_submission(budget='', contact=''))
        self.assertEqual(s['budget_key'], 'undisclosed')
        self.assertEqual(s['contact'], 'email')
        s = parse_submission(good_submission(contact='phone', phone='+971 50 123 4567'))
        self.assertEqual(s['phone'], '+971 50 123 4567')
        s = parse_submission(good_submission(contact='email', phone='junk'))
        self.assertEqual(s['phone'], '')

    def test_strips_control_characters_and_caps_attribution(self):
        s = parse_submission(good_submission(
            company='Acme\u0000\u0007 Ltd', attribution={'utm_source': 'x' * 500, 'evil': 'y'}))
        self.assertEqual(s['company'], 'Acme Ltd')
        self.assertEqual(len(s['attribution']['utm_source']), 200)
        self.assertNotIn('evil', s['attribution'])

    def test_unknown_service_slugs_are_accepted(self):
        # Odoo creates services it does not know yet instead of losing the inquiry.
        s = parse_submission(good_submission(services=['brand-new-service', 'seo', 'seo']))
        self.assertEqual(s['services'], ['brand-new-service', 'seo'])

    def test_envelope(self):
        sub, meta = parse_envelope({'submission': good_submission(), 'meta': {
            'source_url': 'https://mansasmoguls.com', 'client_ip_hash': 'a' * 64,
            'user_agent': 'ua', 'received_at': '2026-11-18T10:00:00.000Z'}})
        self.assertEqual(meta['client_ip_hash'], 'a' * 64)
        self.assertEqual(meta['received_at'].isoformat(), '2026-11-18T10:00:00')
        with self.assertRaises(PayloadError):
            parse_envelope(good_submission())  # bare payload, no envelope
        with self.assertRaises(PayloadError):
            parse_envelope({'submission': good_submission(), 'meta': {'source_url': 'javascript:alert(1)'}})
        with self.assertRaises(PayloadError):
            parse_envelope({'submission': good_submission(), 'meta': {'client_ip_hash': '203.0.113.9'}})
        with self.assertRaises(PayloadError):
            parse_envelope({'submission': good_submission(), 'extra': 1})

    def test_spam(self):
        base = parse_submission(good_submission(startedAt=NOW - 60_000))
        self.assertIsNone(check_spam(base, NOW))
        self.assertEqual(check_spam({**base, 'honeypot': 'http://spam'}, NOW), 'honeypot')
        self.assertEqual(check_spam({**base, 'started_at_ms': NOW - (MIN_FILL_MS - 1)}, NOW), 'too-fast')
        self.assertEqual(check_spam({**base, 'started_at_ms': 0}, NOW), 'too-fast')
        self.assertEqual(check_spam({**base, 'started_at_ms': NOW - 2 * 86_400_000}, NOW), 'stale')
