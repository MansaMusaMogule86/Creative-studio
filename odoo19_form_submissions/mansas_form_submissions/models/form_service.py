# Part of the Mansas Moguls form submissions module. License LGPL-3.
from odoo import api, fields, models

DIVISIONS = [
    ('digital', 'Moguls Digital'),
    ('ai', 'Moguls AI'),
    ('growth', 'Moguls Growth'),
    ('creative', 'Moguls Creative'),
    ('strategy', 'Moguls Strategy'),
    ('other', 'Other'),
]


class MansasFormService(models.Model):
    """A service a visitor can pick on the website form.

    Seeded from the website's ``src/data/divisions.ts``. If the website starts
    sending a slug Odoo does not know yet, the record is created on the fly
    (division "Other") so no submission is ever lost; rename it afterwards.
    """
    _name = 'mansas.form.service'
    _description = 'Website Form Service'
    _order = 'division, sequence, name'

    name = fields.Char(required=True, translate=True)
    slug = fields.Char(
        required=True, index=True,
        help="Identifier sent by the website (src/data/divisions.ts). Do not change.")
    division = fields.Selection(DIVISIONS, required=True, default='other', index=True)
    sequence = fields.Integer(default=10)
    color = fields.Integer()
    active = fields.Boolean(default=True)

    _slug_uniq = models.Constraint('UNIQUE(slug)', 'Each service slug must be unique.')

    @api.model
    def _get_or_create_from_slugs(self, slugs):
        Service = self.sudo().with_context(active_test=False)
        existing = Service.search([('slug', 'in', slugs)])
        known = set(existing.mapped('slug'))
        missing = [s for s in slugs if s not in known]
        if missing:
            existing |= Service.create([{'name': s, 'slug': s, 'division': 'other'} for s in missing])
        by_slug = {s.slug: s for s in existing}
        return Service.browse([by_slug[s].id for s in slugs])
