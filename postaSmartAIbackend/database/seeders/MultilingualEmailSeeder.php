<?php

namespace Database\Seeders;

use App\Models\EmailInbox;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class MultilingualEmailSeeder extends Seeder
{
    public function run(): void
    {
        $emails = [

            // ── ENGLISH ────────────────────────────────────────────────────────

            [
                'message_id'      => 'EN-2026-001@gmail.com',
                'from_name'       => 'James Whitfield',
                'from_email'      => 'j.whitfield@outlook.com',
                'subject'         => 'Lost parcel - Tracking number CP924837156GB',
                'body_text'       => "Dear Customer Service,\n\nI am writing to report that my parcel has not arrived. The tracking number CP924837156GB shows \"Out for delivery\" since 4 days ago, but nothing has been delivered to my address.\n\nThe parcel contains important business documents that I urgently need for a meeting on 16 May.\n\nI have already tried calling your hotline three times but was kept on hold for over 45 minutes each time without getting through.\n\nPlease investigate this matter and provide me with a clear update within 24 hours.\n\nSincerely,\nJames Whitfield\n14 Baker Street, London, EC1A 1BB\nPhone: +44 20 7946 0958",
                'received_at'     => Carbon::now()->subHours(3),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'high',
                'ai_service_type' => 'suivi_colis',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'EN-2026-002@gmail.com',
                'from_name'       => 'Sarah O\'Connor',
                'from_email'      => 'sarah.oconnor.business@gmail.com',
                'subject'         => 'Enquiry - Colissimo International rates for e-commerce (UK/Ireland)',
                'body_text'       => "Hello,\n\nI run an online boutique selling handmade jewellery and I am looking to expand my shipping to France, Belgium, and the Netherlands.\n\nCould you please provide information on:\n- Parcel rates for items between 200g and 2kg\n- Delivery timeframes to the UK and Ireland\n- Insurance options for items valued up to £500\n- Whether you offer a business account with discounted rates\n\nWe currently ship around 80 parcels per month and are expecting growth.\n\nThank you in advance,\nSarah O'Connor\nCEO – Éclat Handmade Ltd.\nDublin, Ireland",
                'received_at'     => Carbon::now()->subHours(9),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'normal',
                'ai_service_type' => 'info_offre',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'EN-2026-003@gmail.com',
                'from_name'       => 'David Harrington',
                'from_email'      => 'd.harrington.retired@yahoo.co.uk',
                'subject'         => 'Complaint - Damaged parcel received - Ref #DMG-2026-EN-441',
                'body_text'       => "To Whom It May Concern,\n\nI received a parcel on 9 May 2026 containing a ceramic vase (gift for my wife's birthday). The box was visibly crushed and the item inside was broken into several pieces.\n\nI had taken out \"Valeur Déclarée\" insurance for €180. I would like to know the procedure to file a compensation claim and how long it typically takes to be reimbursed.\n\nI have photographs of the damaged parcel and its contents which I can provide upon request.\n\nYours faithfully,\nDavid Harrington\nClaim reference: DMG-2026-EN-441",
                'received_at'     => Carbon::now()->subDays(2),
                'is_read'         => true,
                'is_processed'    => false,
                'status'          => 'read',
                'priority'        => 'normal',
                'ai_service_type' => 'reclamation',
                'source'          => 'imap',
            ],

            // ── ESPAÑOL ────────────────────────────────────────────────────────

            [
                'message_id'      => 'ES-2026-001@gmail.com',
                'from_name'       => 'Carlos Ramírez Vega',
                'from_email'      => 'c.ramirez.vega@hotmail.es',
                'subject'         => 'URGENTE - Paquete perdido con documentos notariales',
                'body_text'       => "Estimado Servicio de Atención al Cliente,\n\nMe dirijo a ustedes con gran urgencia. Envié mediante Chronopost el 6 de mayo un paquete con documentos notariales originales (escrituras de propiedad) desde Madrid con destino a París. El número de seguimiento es XK4829103FR.\n\nDesde el 8 de mayo, el estado del envío muestra \"Anomalía en el transporte\" y nadie me ha contactado a pesar de mis llamadas repetidas.\n\nEstos documentos son absolutamente irreemplazables y necesito una respuesta INMEDIATA. Si el paquete no aparece, me veré obligado a iniciar acciones legales.\n\nEsperando una respuesta urgente,\nCarlos Ramírez Vega\nTeléfono: +34 91 234 56 78",
                'received_at'     => Carbon::now()->subHours(1),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'urgent',
                'ai_service_type' => 'escalade_mediateur',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'ES-2026-002@gmail.com',
                'from_name'       => 'Lucía Fernández Torres',
                'from_email'      => 'lucia.fernandez.compras@gmail.com',
                'subject'         => 'Solicitud de información - Envíos internacionales para pequeña empresa',
                'body_text'       => "Buenos días,\n\nSoy responsable de logística en una pequeña empresa de cosméticos naturales (Barcelona). Actualmente exportamos a Francia, Italia y Alemania y estamos evaluando diferentes operadores postales.\n\n¿Podrían informarme sobre:\n- Tarifas para paquetes de 0,5 a 3 kg hacia Europa\n- Tiempos de entrega garantizados\n- Posibilidad de recogida en nuestras instalaciones\n- Condiciones del contrato empresarial\n\nEnviamos aproximadamente 350 paquetes al mes.\n\nQuedo a su disposición para cualquier aclaración.\n\nAtentamente,\nLucía Fernández Torres\nDirectora de Operaciones - Natura Essentials SL",
                'received_at'     => Carbon::now()->subHours(7),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'normal',
                'ai_service_type' => 'info_offre',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'ES-2026-003@gmail.com',
                'from_name'       => 'Miguel Ángel Ortiz',
                'from_email'      => 'miguelortiz.reclamacion@gmail.com',
                'subject'         => 'Reclamación - Doble cobro en mi cuenta - Referencia #LBP-ES-2026-992',
                'body_text'       => "A quien corresponda,\n\nEl pasado 5 de mayo observé que mi cuenta ha sido cargada dos veces por el mismo importe de 134,00 € en concepto de \"servicio de transferencia internacional\".\n\nEste error me ha generado un saldo negativo y tres recibos domiciliados han sido devueltos, lo que me ha costado comisiones adicionales por un total de 45 €.\n\nExijo la devolución inmediata del cargo duplicado, el reembolso de las comisiones generadas por la devolución de recibos, y una explicación formal por escrito.\n\nMiguel Ángel Ortiz\nNúmero de cliente: LBP-ES-2026-992",
                'received_at'     => Carbon::now()->subHours(14),
                'is_read'         => true,
                'is_processed'    => false,
                'status'          => 'read',
                'priority'        => 'high',
                'ai_service_type' => 'reclamation',
                'source'          => 'imap',
            ],

            // ── DEUTSCH ────────────────────────────────────────────────────────

            [
                'message_id'      => 'DE-2026-001@gmail.com',
                'from_name'       => 'Klaus Schneider',
                'from_email'      => 'k.schneider.privat@gmx.de',
                'subject'         => 'Beschwerde - Paket nicht erhalten - Sendungsnummer CP738291045DE',
                'body_text'       => "Sehr geehrte Damen und Herren,\n\nich wende mich an Sie, da ich mein Paket mit der Sendungsnummer CP738291045DE bis heute nicht erhalten habe. Laut Sendungsverfolgung wurde am 7. Mai ein Zustellversuch unternommen, jedoch war ich zu diesem Zeitpunkt zu Hause und habe keine Benachrichtigung erhalten.\n\nIch finde weder einen Abholschein in meinem Briefkasten noch eine Benachrichtigung. Wo befindet sich mein Paket? Das Paket enthält ein Ersatzteil, das ich dringend benötige.\n\nBitte um schnelle Rückmeldung.\n\nMit freundlichen Grüßen,\nKlaus Schneider\nMünchener Str. 42, 80337 München\nTel.: +49 89 1234 5678",
                'received_at'     => Carbon::now()->subHours(5),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'normal',
                'ai_service_type' => 'suivi_colis',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'DE-2026-002@gmail.com',
                'from_name'       => 'Anna-Lena Weber',
                'from_email'      => 'annalenaweber.ecommerce@web.de',
                'subject'         => 'Anfrage Geschäftskunden - Colissimo International Konditionen',
                'body_text'       => "Guten Tag,\n\nmein Name ist Anna-Lena Weber und ich leite ein kleines Online-Unternehmen für Bio-Kosmetik in Hamburg. Wir möchten unsere Versanddienstleistungen auf Frankreich, die Schweiz und Österreich ausweiten.\n\nKönnten Sie uns bitte folgende Informationen zukommen lassen:\n- Versandkosten für Pakete zwischen 500g und 3kg\n- Lieferzeiten nach Deutschland\n- Schadenersatzoptionen für Sendungen bis 300 €\n- Möglichkeit eines Geschäftskundenvertrages\n\nWir versenden derzeit etwa 150 Pakete pro Monat.\n\nVielen Dank im Voraus,\nAnna-Lena Weber\nGeschäftsführerin – NaturGlow GmbH, Hamburg",
                'received_at'     => Carbon::now()->subDays(1),
                'is_read'         => true,
                'is_processed'    => false,
                'status'          => 'read',
                'priority'        => 'normal',
                'ai_service_type' => 'info_offre',
                'source'          => 'imap',
            ],

            // ── ITALIANO ───────────────────────────────────────────────────────

            [
                'message_id'      => 'IT-2026-001@gmail.com',
                'from_name'       => 'Marco Esposito',
                'from_email'      => 'marco.esposito.milano@libero.it',
                'subject'         => 'URGENTE - Pacco smarrito con merce preziosa',
                'body_text'       => "Gentile Servizio Clienti,\n\nVi scrivo con estrema urgenza. Ho spedito tramite Chronopost il 4 maggio un pacco contenente gioielli di famiglia (valore assicurato 1.200 €) con destinazione Parigi. Il numero di tracciamento è CP192837465IT.\n\nDal 6 maggio il tracking mostra \"Anomalia durante il trasporto\" e nessuno del vostro servizio clienti ha risposto alle mie numerose telefonate.\n\nSe il pacco non viene ritrovato entro 48 ore, sarò costretto ad adire le vie legali e a contattare i media locali.\n\nIn attesa di una vostra risposta celere,\nMarco Esposito\nTel.: +39 02 8765 4321",
                'received_at'     => Carbon::now()->subHours(2),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'urgent',
                'ai_service_type' => 'escalade_mediateur',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'IT-2026-002@gmail.com',
                'from_name'       => 'Giulia Ricci',
                'from_email'      => 'giulia.ricci.shop@gmail.com',
                'subject'         => 'Richiesta informazioni - Spedizioni verso Francia e Belgio',
                'body_text'       => "Buongiorno,\n\nGestisco un piccolo e-commerce di prodotti artigianali toscani (ceramiche, tessuti, vini) e sto cercando un partner per le spedizioni verso Francia, Belgio e Lussemburgo.\n\nAvreste la gentilezza di fornirmi:\n- Tariffe per colli da 1 a 10 kg\n- Tempi di consegna stimati\n- Opzioni di assicurazione per oggetti fragili\n- Condizioni per un contratto business\n\nSpediamo circa 120 pacchi al mese.\n\nGrazie mille,\nGiulia Ricci\nTitolare – La Bottega Toscana, Firenze",
                'received_at'     => Carbon::now()->subHours(11),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'low',
                'ai_service_type' => 'info_offre',
                'source'          => 'imap',
            ],

            // ── ARABIC (العربية) ───────────────────────────────────────────────

            [
                'message_id'      => 'AR-2026-001@gmail.com',
                'from_name'       => 'Youssef El Amrani',
                'from_email'      => 'youssef.elamrani@gmail.com',
                'subject'         => 'شكوى عاجلة - طرد مفقود يحتوي على وثائق رسمية',
                'body_text'       => "السيد/ة المحترم/ة،\n\nأتواصل معكم بشأن مشكلة عاجلة تتعلق بطرد أرسلته عبر خدمة كرونوبوست بتاريخ 5 مايو 2026، ويحتوي على وثائق رسمية أصلية لا يمكن استبدالها (شهادات وعقود موثقة).\n\nرقم التتبع هو: CP847291036FR\n\nمنذ 7 مايو، يُظهر نظام التتبع رسالة \"خلل أثناء النقل\" ولم يتواصل معي أحد رغم اتصالاتي المتعددة بخدمة العملاء.\n\nهذه الوثائق ضرورية لإتمام صفقة عقارية مهمة موعدها 18 مايو. عدم وصولها سيُلحق بي خسائر مالية فادحة.\n\nأطلب منكم التدخل الفوري وإعطائي إجابة واضحة خلال 24 ساعة.\n\nمع التقدير،\nيوسف الأمراني\nهاتف: +33 6 45 78 23 10",
                'received_at'     => Carbon::now()->subHours(4),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'urgent',
                'ai_service_type' => 'escalade_mediateur',
                'source'          => 'imap',
            ],
            [
                'message_id'      => 'AR-2026-002@gmail.com',
                'from_name'       => 'Fatima Bensouda',
                'from_email'      => 'fatima.bensouda.commerce@outlook.com',
                'subject'         => 'استفسار - خدمات الشحن الدولي للشركات الصغيرة',
                'body_text'       => "مرحباً،\n\nأنا مديرة شركة صغيرة لتجارة المنتجات الحرفية المغربية (ملابس تقليدية، حلي، منتجات الأرغان) وأودّ توسيع نشاطي نحو فرنسا وبلجيكا وهولندا.\n\nهل بإمكانكم إطلاعي على:\n- تعريفات الشحن للطرود بين 1 و5 كيلوغرامات\n- مدد التسليم المضمونة\n- خيارات التأمين للبضائع الهشة\n- شروط عقد الأعمال الخاص بالمقاولات الصغيرة\n\nنشحن حالياً نحو 80 طرداً شهرياً.\n\nشكراً جزيلاً لتعاونكم،\nفاطمة بنسودة\nمديرة – دار الحرف المغربية",
                'received_at'     => Carbon::now()->subDays(1)->subHours(2),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'normal',
                'ai_service_type' => 'info_offre',
                'source'          => 'imap',
            ],

            // ── PORTUGUÊS ──────────────────────────────────────────────────────

            [
                'message_id'      => 'PT-2026-001@gmail.com',
                'from_name'       => 'Ana Cristina Ferreira',
                'from_email'      => 'anacristina.ferreira@sapo.pt',
                'subject'         => 'Reclamação - Encomenda danificada - Referência #REC-PT-2026-338',
                'body_text'       => "Exmo. Serviço de Apoio ao Cliente,\n\nRecebi no dia 8 de maio de 2026 uma encomenda com a referência REC-PT-2026-338. A caixa chegou completamente amassada e o conteúdo — um computador portátil no valor de 850 € — apresenta danos graves no ecrã.\n\nHavia contratado o seguro de valor declarado até 1.000 €. Solicito o início imediato do processo de indemnização e a atribuição de um interlocutor fixo para acompanhar o meu dossier.\n\nEspero a vossa resposta com urgência, pois necessito do equipamento para o meu trabalho diário.\n\nCom os melhores cumprimentos,\nAna Cristina Ferreira\nPorto, Portugal",
                'received_at'     => Carbon::now()->subHours(6),
                'is_read'         => false,
                'is_processed'    => false,
                'status'          => 'unread',
                'priority'        => 'high',
                'ai_service_type' => 'reclamation',
                'source'          => 'imap',
            ],
        ];

        foreach ($emails as $email) {
            EmailInbox::updateOrCreate(['message_id' => $email['message_id']], $email);
        }

        $this->command->info(count($emails) . ' mails multilingues créés (EN/ES/DE/IT/AR/PT).');
    }
}
