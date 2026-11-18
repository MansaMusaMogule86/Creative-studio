{
    'name': 'Website Form Submissions (Mansas Moguls)',
    'version': '19.0.1.0.0',
    'summary': 'Receive and manage contact-form submissions from the Mansas Moguls website through a secure API.',
    'description': """
Stores inquiries sent by the external Mansas Moguls website (mansasmoguls.com)
in a dedicated model, independent of CRM leads.

* Authenticated JSON API (Bearer key, stored hashed, shown once)
* Same validation rules as the website form, strict payload shape
* Spam protection: honeypot, fill-time check, per-key and per-visitor rate limits
* Idempotent: retries of the same submission are never duplicated
* Backend menu with list, form and search views, chatter and activities
    """,
    'category': 'Marketing',
    'author': 'Mansas Moguls',
    'license': 'LGPL-3',
    'depends': ['base', 'mail'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/ir_sequence_data.xml',
        'data/form_service_data.xml',
        'views/form_submission_views.xml',
        'views/form_service_views.xml',
        'views/api_key_views.xml',
        'views/menus.xml',
    ],
    'installable': True,
    'application': True,
}
