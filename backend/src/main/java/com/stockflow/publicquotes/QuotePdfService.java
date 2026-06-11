package com.stockflow.publicquotes;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.stockflow.companies.CompanyEntity;
import com.stockflow.companies.CompanySettingsResponse;
import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteItemEntity;
import com.stockflow.quotes.QuoteItemType;
import com.stockflow.quotes.QuoteStatus;
import jakarta.enterprise.context.ApplicationScoped;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@ApplicationScoped
public class QuotePdfService {

    private static final Locale BR_LOCALE = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color PRIMARY = new Color(15, 118, 110);
    private static final Color INK = new Color(15, 23, 42);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final Color SOFT = new Color(240, 253, 250);

    public QuotePdfResponse generate(QuoteEntity quote) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 42, 42);
        try {
            PdfWriter.getInstance(document, output);
            document.open();
            addHeader(document, quote);
            addParties(document, quote);
            addItems(document, quote);
            addTotals(document, quote);
            addNotes(document, quote);
            addFooter(document, quote);
        } catch (DocumentException exception) {
            throw new IllegalStateException("Could not generate quote PDF", exception);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }
        return new QuotePdfResponse(output.toByteArray(), filename(quote));
    }

    private void addHeader(Document document, QuoteEntity quote) throws DocumentException {
        PdfPTable header = table(2, 100);
        header.setWidths(new float[] {65, 35});

        PdfPCell company = cell();
        company.addElement(paragraph("Proposta Comercial", font(20, Font.BOLD, PRIMARY)));
        company.addElement(paragraph(CompanySettingsResponse.commercialName(quote.company), font(13, Font.BOLD, INK)));
        addSmall(company, quote.company.legalName);
        addSmall(company, quote.company.document == null ? null : "Documento: " + quote.company.document);
        addSmall(company, quote.company.email == null ? null : "E-mail: " + quote.company.email);
        addSmall(company, quote.company.phone == null ? null : "Telefone: " + quote.company.phone);
        addSmall(company, quote.company.whatsapp == null ? null : "WhatsApp: " + quote.company.whatsapp);
        addSmall(company, companyAddress(quote.company));
        header.addCell(company);

        PdfPCell summary = cell();
        summary.setHorizontalAlignment(Element.ALIGN_RIGHT);
        summary.addElement(right("Orcamento " + quote.code, font(13, Font.BOLD, INK)));
        summary.addElement(right("Criado em " + DATE_TIME.format(quote.createdAt), smallFont()));
        summary.addElement(right("Status: " + status(quote.status), smallFont()));
        if (quote.validUntil != null) {
            summary.addElement(right("Valido ate " + DATE.format(quote.validUntil), smallFont()));
        }
        header.addCell(summary);
        document.add(header);
        document.add(Chunk.NEWLINE);
    }

    private void addParties(Document document, QuoteEntity quote) throws DocumentException {
        PdfPTable parties = table(2, 100);
        parties.setWidths(new float[] {50, 50});
        parties.addCell(sectionCell("Cliente", customerDetails(quote)));
        parties.addCell(sectionCell("Condicoes", quoteDetails(quote)));
        document.add(parties);
        document.add(Chunk.NEWLINE);
    }

    private void addItems(Document document, QuoteEntity quote) throws DocumentException {
        document.add(paragraph("Itens da proposta", font(12, Font.BOLD, INK)));
        PdfPTable items = table(7, 100);
        items.setWidths(new float[] {7, 32, 12, 11, 14, 12, 12});
        header(items, "Item");
        header(items, "Descricao");
        header(items, "Tipo");
        header(items, "Qtd.");
        header(items, "Unitario");
        header(items, "Desconto");
        header(items, "Total");

        int index = 1;
        for (QuoteItemEntity item : quote.items) {
            body(items, String.valueOf(index++), Element.ALIGN_CENTER);
            body(items, item.description, Element.ALIGN_LEFT);
            body(items, item.itemType == QuoteItemType.PRODUCT ? "Produto" : "Servico", Element.ALIGN_LEFT);
            body(items, decimal(item.quantity), Element.ALIGN_RIGHT);
            body(items, money(item.unitPrice), Element.ALIGN_RIGHT);
            body(items, money(item.discount), Element.ALIGN_RIGHT);
            body(items, money(item.total), Element.ALIGN_RIGHT);
        }
        document.add(items);
        document.add(Chunk.NEWLINE);
    }

    private void addTotals(Document document, QuoteEntity quote) throws DocumentException {
        PdfPTable wrapper = table(2, 100);
        wrapper.setWidths(new float[] {55, 45});
        wrapper.addCell(cell());

        PdfPTable totals = table(2, 100);
        totalRow(totals, "Subtotal", quote.subtotal, false);
        totalRow(totals, "Desconto", quote.discount, false);
        totalRow(totals, "Frete", quote.shipping, false);
        totalRow(totals, "Total final", quote.total, true);
        PdfPCell totalsCell = cell();
        totalsCell.addElement(totals);
        wrapper.addCell(totalsCell);
        document.add(wrapper);
    }

    private void addNotes(Document document, QuoteEntity quote) throws DocumentException {
        String paymentTerms = resolvedPaymentTerms(quote);
        String notesText = resolvedNotes(quote);
        if (paymentTerms == null && notesText == null) {
            return;
        }
        document.add(Chunk.NEWLINE);
        PdfPTable notes = table(1, 100);
        PdfPCell cell = borderedCell();
        cell.setBackgroundColor(new Color(248, 250, 252));
        if (paymentTerms != null) {
            cell.addElement(paragraph("Condicoes de pagamento: " + paymentTerms, smallFont()));
        }
        if (notesText != null) {
            cell.addElement(paragraph("Observacoes: " + notesText, smallFont()));
        }
        notes.addCell(cell);
        document.add(notes);
    }

    private void addFooter(Document document, QuoteEntity quote) throws DocumentException {
        document.add(Chunk.NEWLINE);
        Paragraph footer = paragraph("Esta proposta foi gerada pelo StockFlow.", smallFont());
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
        if (quote.validUntil != null) {
            Paragraph validity = paragraph("Proposta valida ate: " + DATE.format(quote.validUntil), smallFont());
            validity.setAlignment(Element.ALIGN_CENTER);
            document.add(validity);
        }
    }

    private PdfPCell sectionCell(String title, String[] lines) {
        PdfPCell cell = borderedCell();
        cell.addElement(paragraph(title, font(11, Font.BOLD, PRIMARY)));
        for (String line : lines) {
            if (line != null && !line.isBlank()) {
                cell.addElement(paragraph(line, smallFont()));
            }
        }
        return cell;
    }

    private String[] customerDetails(QuoteEntity quote) {
        return new String[] {
                quote.customer.name,
                quote.customer.document == null ? null : "Documento: " + quote.customer.document,
                quote.customer.email == null ? null : "E-mail: " + quote.customer.email,
                quote.customer.phone == null ? null : "Telefone: " + quote.customer.phone,
                quote.customer.whatsapp == null ? null : "WhatsApp: " + quote.customer.whatsapp,
                cityState(quote)
        };
    }

    private String[] quoteDetails(QuoteEntity quote) {
        return new String[] {
                "Codigo: " + quote.code,
                "Status: " + status(quote.status),
                quote.validUntil == null ? null : "Validade: " + DATE.format(quote.validUntil),
                resolvedPaymentTerms(quote) == null ? null : "Pagamento: " + resolvedPaymentTerms(quote)
        };
    }

    private String companyAddress(CompanyEntity company) {
        String street = join(" ", company.address, company.addressNumber);
        String city = cityState(company.city, company.state);
        String address = join(", ", street, company.addressComplement, company.neighborhood, city, company.zipCode);
        return address == null ? null : "Endereço: " + address;
    }

    private String resolvedNotes(QuoteEntity quote) {
        return firstPresent(quote.notes, quote.company.defaultQuoteNotes);
    }

    private String resolvedPaymentTerms(QuoteEntity quote) {
        return firstPresent(quote.paymentTerms, quote.company.defaultPaymentTerms);
    }

    private String cityState(QuoteEntity quote) {
        return cityState(quote.customer.city, quote.customer.state);
    }

    private String cityState(String city, String state) {
        if (city == null && state == null) {
            return null;
        }
        if (city == null) {
            return state;
        }
        if (state == null) {
            return city;
        }
        return city + "/" + state;
    }

    private String firstPresent(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return null;
    }

    private String join(String separator, String... values) {
        StringBuilder builder = new StringBuilder();
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(separator);
            }
            builder.append(value);
        }
        return builder.isEmpty() ? null : builder.toString();
    }

    private void totalRow(PdfPTable table, String label, BigDecimal value, boolean highlight) {
        PdfPCell labelCell = borderedCell(label, highlight ? font(11, Font.BOLD, INK) : smallFont(), Element.ALIGN_LEFT);
        PdfPCell valueCell = borderedCell(money(value), highlight ? font(12, Font.BOLD, PRIMARY) : smallFont(), Element.ALIGN_RIGHT);
        if (highlight) {
            labelCell.setBackgroundColor(SOFT);
            valueCell.setBackgroundColor(SOFT);
        }
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void header(PdfPTable table, String text) {
        PdfPCell cell = borderedCell(text, font(8, Font.BOLD, Color.WHITE), Element.ALIGN_CENTER);
        cell.setBackgroundColor(PRIMARY);
        table.addCell(cell);
    }

    private void body(PdfPTable table, String text, int alignment) {
        table.addCell(borderedCell(text, font(8, Font.NORMAL, INK), alignment));
    }

    private PdfPTable table(int columns, int widthPercentage) {
        PdfPTable table = new PdfPTable(columns);
        table.setWidthPercentage(widthPercentage);
        table.setSpacingBefore(2);
        table.setSpacingAfter(2);
        return table;
    }

    private PdfPCell cell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(4);
        return cell;
    }

    private PdfPCell borderedCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER);
        cell.setPadding(8);
        return cell;
    }

    private PdfPCell borderedCell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorderColor(BORDER);
        cell.setPadding(7);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private void addSmall(PdfPCell cell, String text) {
        if (text != null && !text.isBlank()) {
            cell.addElement(paragraph(text, smallFont()));
        }
    }

    private Paragraph right(String text, Font font) {
        Paragraph paragraph = paragraph(text, font);
        paragraph.setAlignment(Element.ALIGN_RIGHT);
        return paragraph;
    }

    private Paragraph paragraph(String text, Font font) {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setLeading(13);
        paragraph.setSpacingAfter(3);
        return paragraph;
    }

    private Font smallFont() {
        return font(9, Font.NORMAL, MUTED);
    }

    private Font font(int size, int style, Color color) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA, size, style);
        font.setColor(color);
        return font;
    }

    private String money(BigDecimal value) {
        return NumberFormat.getCurrencyInstance(BR_LOCALE).format(value == null ? BigDecimal.ZERO : value);
    }

    private String decimal(BigDecimal value) {
        return value == null ? "-" : value.stripTrailingZeros().toPlainString();
    }

    private String status(QuoteStatus status) {
        return switch (status) {
            case DRAFT -> "Rascunho";
            case SENT -> "Enviado";
            case CUSTOMER_APPROVED -> "Aprovado pelo cliente";
            case COMPLETED -> "Concluido";
            case REJECTED -> "Recusado";
            case CANCELLED -> "Cancelado";
            case EXPIRED -> "Expirado";
        };
    }

    private String filename(QuoteEntity quote) {
        return "proposta-" + quote.code.replaceAll("[^A-Za-z0-9_-]", "-") + ".pdf";
    }
}
