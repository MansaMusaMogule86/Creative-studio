# Part of the Mansas Moguls form submissions module. License LGPL-3.
import hashlib
import hmac
import secrets

from odoo import _, api, fields, models
from odoo.exceptions import UserError

KEY_PREFIX = 'mmfs'


def _hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


class MansasFormApiKey(models.Model):
    """Credentials a website uses to post submissions.

    Only a SHA-256 hash of each key is stored. The plaintext key is shown
    once, when it is generated, and cannot be recovered afterwards.
    Keys are high-entropy random tokens (256 bits), so a fast hash is safe.
    """
    _name = 'mansas.form.api.key'
    _description = 'Website Form API Key'
    _order = 'name'

    name = fields.Char(
        string='Website', required=True,
        help="A label for the website that uses this key, e.g. mansasmoguls.com.")
    website_url = fields.Char(
        string='Website URL',
        help="Used as the submission's source when the website does not send one.")
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        'res.company', string='Company', required=True, default=lambda self: self.env.company)
    key_index = fields.Char(string='Key Prefix', readonly=True, index=True, copy=False)
    key_hash = fields.Char(readonly=True, copy=False, groups='base.group_system')
    has_key = fields.Boolean(compute='_compute_has_key')
    rate_limit_per_minute = fields.Integer(
        string='Rate Limit (per minute)', default=60, required=True,
        help="Maximum number of submissions accepted with this key per minute (all visitors combined).")
    last_used_at = fields.Datetime(string='Last Used', readonly=True, copy=False)
    submission_count = fields.Integer(compute='_compute_submission_count')

    _key_index_uniq = models.Constraint('UNIQUE(key_index)', 'Key prefixes must be unique.')
    _rate_limit_positive = models.Constraint(
        'CHECK(rate_limit_per_minute > 0)', 'The rate limit must be greater than zero.')

    @api.depends('key_index')
    def _compute_has_key(self):
        for rec in self:
            rec.has_key = bool(rec.key_index)

    def _compute_submission_count(self):
        counts = dict(self.env['mansas.form.submission'].with_context(active_test=False)._read_group(
            [('api_key_id', 'in', self.ids)], ['api_key_id'], ['__count']))
        for rec in self:
            rec.submission_count = counts.get(rec, 0)

    def action_generate_key(self):
        """Create (or rotate) the key and show it once. The previous key stops working."""
        self.ensure_one()
        if not self.env.user.has_group('mansas_form_submissions.group_form_submission_manager'):
            raise UserError(_("Only Form Submission administrators can generate API keys."))
        index = secrets.token_hex(6)
        token = f'{KEY_PREFIX}_{index}_{secrets.token_urlsafe(32)}'
        self.sudo().write({'key_index': index, 'key_hash': _hash(token)})
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'mansas.form.api.key.show',
            'name': _('API Key Ready'),
            'views': [(False, 'form')],
            'target': 'new',
            'context': {'default_key': token},
        }

    def action_revoke_key(self):
        self.sudo().write({'key_index': False, 'key_hash': False})

    def action_view_submissions(self):
        self.ensure_one()
        action = self.env['ir.actions.act_window']._for_xml_id(
            'mansas_form_submissions.action_form_submission')
        action['domain'] = [('api_key_id', '=', self.id)]
        action['context'] = {'active_test': False}
        return action

    @api.model
    def _authenticate(self, token):
        """Return the active key record matching ``token``, or an empty recordset."""
        empty = self.browse()
        if not token or len(token) > 200:
            return empty
        parts = token.split('_', 2)
        if len(parts) != 3 or parts[0] != KEY_PREFIX:
            return empty
        key = self.sudo().search([('key_index', '=', parts[1]), ('active', '=', True)], limit=1)
        if not key or not key.key_hash:
            # Burn a comparable amount of time so timing does not reveal valid prefixes.
            hmac.compare_digest(_hash(token), '0' * 64)
            return empty
        if not hmac.compare_digest(_hash(token), key.key_hash):
            return empty
        return key


class MansasFormApiKeyShow(models.AbstractModel):
    """Displays a freshly generated key once. Nothing is stored."""
    _name = 'mansas.form.api.key.show'
    _description = 'Show Website Form API Key'

    # The 'id' field is needed for the onchange that returns the value of 'key'.
    id = fields.Id()
    key = fields.Char(readonly=True)
