from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable, KeepTogether
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_JUSTIFY, TA_CENTER
import datetime

# ----------------- Palette -----------------
PALETTE = {
    'soft_yellow': '#FFF3C4',
    'accent_yellow': '#F6C90E',
    'dark_yellow': '#B8940A',
    'pale_blue': '#EEF3FB',
    'mid_blue': '#4A7FC1',
    'deep_blue': '#1E3A6E',
    'text_gray': '#4A5568',
    'borders': '#DDE6F5',
    'light_lines': '#F8F9FA',
    'footer_gray': '#9AABCB',
}

# ----------------- Measurements -----------------
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_LEFT = 18 * mm
MARGIN_RIGHT = 18 * mm
MARGIN_TOP = 44 * mm
MARGIN_BOTTOM = 24 * mm

# ----------------- Styles -----------------
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Body', fontName='Helvetica', fontSize=9, leading=15, textColor=PALETTE['text_gray']))
styles.add(ParagraphStyle(name='BodyJust', parent=styles['Body'], alignment=TA_JUSTIFY))
styles.add(ParagraphStyle(name='Title', fontName='Helvetica-Bold', fontSize=16, textColor=PALETTE['deep_blue'], leading=18))
styles.add(ParagraphStyle(name='Subtitle', fontName='Helvetica', fontSize=8.5, textColor=PALETTE['mid_blue']))
styles.add(ParagraphStyle(name='Meta', fontName='Helvetica', fontSize=8, textColor=PALETTE['text_gray']))
styles.add(ParagraphStyle(name='SectionHeader', fontName='Helvetica-Bold', fontSize=8, textColor=PALETTE['deep_blue'], uppercase=True))
styles.add(ParagraphStyle(name='SmallBold', fontName='Helvetica-Bold', fontSize=9, textColor=PALETTE['deep_blue']))

# ----------------- Canvas header/footer -----------------

def draw_header(c: canvas.Canvas, doc):
    c.saveState()
    # top yellow bar 3mm
    bar_h = 3 * mm
    c.setFillColor(colors.HexColor(PALETTE['accent_yellow']))
    c.rect(0, PAGE_HEIGHT - bar_h, PAGE_WIDTH, bar_h, stroke=0, fill=1)

    # Title left
    x_title = MARGIN_LEFT
    y_title = PAGE_HEIGHT - MARGIN_TOP + 20
    c.setFont('Helvetica-Bold', 16)
    c.setFillColor(colors.HexColor(PALETTE['deep_blue']))
    c.drawString(x_title, y_title, 'PostSmart IA')

    # Subtitle under title
    c.setFont('Helvetica', 8.5)
    c.setFillColor(colors.HexColor(PALETTE['mid_blue']))
    c.drawString(x_title, y_title - 14, 'Compte-rendu d\'appel client')

    # Date & ref right
    c.setFont('Helvetica', 8)
    c.setFillColor(colors.HexColor(PALETTE['text_gray']))
    date_str = datetime.date.today().strftime('%d %b %Y')
    ref_str = 'Réf. appel 00026'
    text_w = c.stringWidth(date_str + '  ' + ref_str, 'Helvetica', 8)
    x_meta = PAGE_WIDTH - MARGIN_RIGHT - text_w
    c.drawRightString(PAGE_WIDTH - MARGIN_RIGHT, y_title, date_str)
    c.drawRightString(PAGE_WIDTH - MARGIN_RIGHT, y_title - 12, ref_str)

    # Underline 1.5pt yellow under title
    c.setStrokeColor(colors.HexColor(PALETTE['accent_yellow']))
    c.setLineWidth(1.5)
    c.line(MARGIN_LEFT, y_title - 18, PAGE_WIDTH - MARGIN_RIGHT, y_title - 18)

    # Badges
    badge_y = y_title - 32
    # Badge 1
    c.setFillColor(colors.HexColor(PALETTE['pale_blue']))
    c.roundRect(MARGIN_LEFT, badge_y - 4, 110, 16, 8, stroke=0, fill=1)
    c.setFont('Helvetica-Bold', 7.5)
    c.setFillColor(colors.HexColor(PALETTE['deep_blue']))
    c.drawString(MARGIN_LEFT + 8, badge_y + 2, 'RÉCLAMATION')
    # Badge 2
    c.setFillColor(colors.HexColor(PALETTE['soft_yellow']))
    c.roundRect(MARGIN_LEFT + 120, badge_y - 4, 120, 16, 8, stroke=0, fill=1)
    c.setFillColor(colors.HexColor(PALETTE['dark_yellow']))
    c.drawString(MARGIN_LEFT + 128, badge_y + 2, 'URGENCE NORMALE')

    c.restoreState()


def draw_footer(c: canvas.Canvas, doc):
    c.saveState()
    # horizontal line 16mm from bottom
    y = 16 * mm
    c.setStrokeColor(colors.HexColor(PALETTE['borders']))
    c.setLineWidth(0.5)
    c.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)

    # Left text
    c.setFont('Helvetica', 7)
    c.setFillColor(colors.HexColor(PALETTE['footer_gray']))
    c.drawString(MARGIN_LEFT, y - 10, 'PostSmart IA — Document confidentiel — La Poste')

    # page number right
    page_str = f'Page {doc.page}'
    c.drawRightString(PAGE_WIDTH - MARGIN_RIGHT, y - 10, page_str)

    # small yellow dot centered
    cx = PAGE_WIDTH / 2
    c.setFillColor(colors.HexColor(PALETTE['accent_yellow']))
    c.circle(cx, y + 2, 4, stroke=0, fill=1)

    c.restoreState()

# ----------------- Flowables / Helpers -----------------

class SectionHeader(Flowable):
    def __init__(self, text, accent_color='#F6C90E'):
        Flowable.__init__(self)
        self.text = text
        self.accent = accent_color
        self.width = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
        self.height = 18

    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        x = 0
        y = 0
        # background band
        c.saveState()
        c.setFillColor(colors.HexColor(PALETTE['pale_blue']))
        c.rect(x, y, self.width, self.height, stroke=0, fill=1)
        # left vertical accent 3pt
        c.setFillColor(colors.HexColor(self.accent))
        c.rect(x, y, 3, self.height, stroke=0, fill=1)
        # border
        c.setStrokeColor(colors.HexColor(PALETTE['borders']))
        c.setLineWidth(0.5)
        c.rect(x, y, self.width, self.height, stroke=1, fill=0)
        # text
        c.setFont('Helvetica-Bold', 8)
        c.setFillColor(colors.HexColor(PALETTE['deep_blue']))
        c.drawString(x + 8, y + 5, self.text.upper())
        c.restoreState()

# ----------------- Section Builders -----------------

def build_info_section(data):
    hdr = SectionHeader('INFORMATIONS DE L\'APPEL', accent_color=PALETTE['accent_yellow'])
    # table 2 cols: 30mm | rest
    left_w = 30 * mm
    right_w = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - left_w
    rows = []
    labels = [
        ('Client', data.get('client')),
        ('E-mail', data.get('email')),
        ('Téléphone', data.get('phone')),
        ('Date', data.get('date')),
        ('Durée', data.get('duration')),
        ('Type', data.get('type')),
    ]
    for i, (lab, val) in enumerate(labels):
        bg = colors.HexColor(PALETTE['light_lines']) if i % 2 else colors.white
        rows.append([Paragraph(f'<b>{lab}</b>', styles['SmallBold']), Paragraph(val or '', styles['Body'])])

    tbl = Table(rows, colWidths=[left_w, right_w], hAlign='LEFT')
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor(PALETTE['borders'])),
        ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor(PALETTE['borders'])),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return [hdr, Spacer(1, 3*mm), tbl, Spacer(1, 7*mm)]


def build_summary_section(text):
    hdr = SectionHeader('RÉSUMÉ DE L\'ÉCHANGE', accent_color=PALETTE['accent_yellow'])
    # block full width with soft yellow
    box = Table([[Paragraph(text, styles['BodyJust'])]], colWidths=[PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT])
    box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(PALETTE['soft_yellow'])),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E8D87A')),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 9),
    ]))
    return [hdr, Spacer(1, 3*mm), box, Spacer(1, 7*mm)]


def build_engagements_section(items):
    hdr = SectionHeader('ENGAGEMENTS PRIS', accent_color=PALETTE['mid_blue'])
    rows = []
    for i, text in enumerate(items, start=1):
        num = Paragraph(str(i), ParagraphStyle('Num', fontName='Helvetica-Bold', fontSize=9, alignment=TA_CENTER, textColor=colors.white))
        num_tbl = Table([[num]], colWidths=[9*mm])
        num_tbl.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor(PALETTE['mid_blue'])), ('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
        desc = Paragraph(text, styles['Body'])
        rows.append([num_tbl, desc])

    tbl = Table(rows, colWidths=[9*mm, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 9*mm])
    tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor(PALETTE['borders'])),
        ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor(PALETTE['borders'])),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),6),
    ]))
    return [hdr, Spacer(1, 3*mm), tbl, Spacer(1, 7*mm)]


def build_next_steps_section(steps):
    hdr = SectionHeader('PROCHAINES ÉTAPES', accent_color=PALETTE['mid_blue'])
    rows = []
    for title, desc in steps:
        icon = Paragraph('<font color="%s">✉</font>' % PALETTE['mid_blue'], ParagraphStyle('Icon', fontSize=13, alignment=TA_LEFT))
        content = Paragraph(f'<b>{title}</b><br/>{desc}', styles['Body'])
        rows.append([icon, content])

    tbl = Table(rows, colWidths=[11*mm, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 11*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(PALETTE['pale_blue'])),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor(PALETTE['borders'])),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),6),
    ]))
    return [hdr, Spacer(1, 3*mm), tbl, Spacer(1, 7*mm)]


def build_email_section(meta, body_text):
    hdr = SectionHeader('E-MAIL POST-APPEL GÉNÉRÉ', accent_color=PALETTE['accent_yellow'])
    # meta block
    left_w = 30 * mm
    right_w = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - left_w
    meta_rows = []
    for k,v in [('De', meta.get('from')), ('À', meta.get('to')), ('Objet', meta.get('subject'))]:
        meta_rows.append([Paragraph(f'<b>{k}</b>', styles['SmallBold']), Paragraph(v or '', styles['Body'])])
    meta_tbl = Table(meta_rows, colWidths=[left_w, right_w])
    meta_tbl.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),colors.HexColor(PALETTE['soft_yellow'])),
        ('BOX',(0,0),(-1,-1),0.5,colors.HexColor('#E8D87A')),
        ('LEFTPADDING',(0,0),(-1,-1),6),
    ]))

    # body block
    body_tbl = Table([[Paragraph(body_text, styles['BodyJust'])]], colWidths=[PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT])
    body_tbl.setStyle(TableStyle([
        ('BOX',(0,0),(-1,-1),0.5,colors.HexColor(PALETTE['borders'])),
        ('LEFTPADDING',(0,0),(-1,-1),9),
        ('RIGHTPADDING',(0,0),(-1,-1),9),
        ('TOPPADDING',(0,0),(-1,-1),9),
        ('BOTTOMPADDING',(0,0),(-1,-1),9),
    ]))

    return [hdr, Spacer(1,3*mm), meta_tbl, Spacer(1,6*mm), body_tbl, Spacer(1,7*mm)]

# ----------------- Main generator -----------------

def generate_report(output_path, data):
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT,
                            topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM)
    story = []

    story.extend(build_info_section(data))
    story.extend(build_summary_section(data.get('summary', '')))
    story.extend(build_engagements_section(data.get('engagements', [])))
    story.extend(build_next_steps_section(data.get('next_steps', [])))
    story.extend(build_email_section(data.get('email_meta', {}), data.get('email_body', '')))

    doc.build(story, onFirstPage=draw_header, onLaterPages=draw_header, onFirstPageEnd=draw_footer, onLaterPagesEnd=draw_footer)


# ----------------- Sample usage -----------------
if __name__ == '__main__':
    sample = {
        'client': 'Jean Dubois',
        'email': 'jeandubois@bidtwd.com',
        'phone': '01 92 41 83 60',
        'date': '14/05/2026 00:26',
        'duration': '2 minutes',
        'type': 'Réclamation - Urgence normale',
        'summary': "Le client indique qu'il n'a pas récupéré l'intégralité de son colis : seule une partie lui a été livrée. Il signale attendre toujours la réception de la partie manquante.",
        'engagements': ['Vérification en interne des raisons de la livraison partielle du colis.', 'Retour au client dans les meilleurs délais concernant l’état de sa réclamation.'],
        'next_steps': [('Envoyer l\'e-mail de confirmation au client', 'Transmettre le mail généré ci-dessous à jeannedubois@bidtwd.com dès que possible.')],
        'email_meta': {'from': 'Service client PostSmart IA – La Poste', 'to': 'jeannedubois@bidtwd.com', 'subject': "Suite à votre réclamation - Colis partiellement livré"},
        'email_body': "Monsieur Dubois,<br/><br/>Nous vous remercions de nous avoir contactés concernant votre réclamation relative à la livraison partielle de votre colis.\n\nLors de notre entretien téléphonique, vous nous avez informés que vous attendez toujours la réception de la partie manquante. Nous allons procéder aux vérifications nécessaires et revenir vers vous rapidement.<br/><br/>Cordialement,<br/>Service client PostSmart IA",
    }
    generate_report('postsmart_report_sample.pdf', sample)
