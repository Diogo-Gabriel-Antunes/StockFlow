package com.stockflow.publicquotes;

import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteItemEntity;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class QuotePdfService {

    public byte[] generate(QuoteEntity quote) {
        List<String> lines = new ArrayList<>();
        lines.add("StockFlow - Proposta " + quote.code);
        lines.add("Empresa: " + quote.company.name);
        lines.add("Cliente: " + quote.customer.name);
        lines.add("Status: " + quote.status);
        lines.add("Validade: " + (quote.validUntil == null ? "-" : quote.validUntil));
        lines.add("");
        for (QuoteItemEntity item : quote.items) {
            lines.add(item.description + " | qtd " + item.quantity + " | total " + money(item.total));
        }
        lines.add("");
        lines.add("Subtotal: " + money(quote.subtotal));
        lines.add("Desconto: " + money(quote.discount));
        lines.add("Frete: " + money(quote.shipping));
        lines.add("Total: " + money(quote.total));

        StringBuilder text = new StringBuilder("BT /F1 12 Tf 50 780 Td ");
        for (String line : lines) {
            text.append("(").append(escape(line)).append(") Tj 0 -18 Td ");
        }
        text.append("ET");
        byte[] content = text.toString().getBytes(StandardCharsets.US_ASCII);

        String object1 = "<< /Type /Catalog /Pages 2 0 R >>";
        String object2 = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
        String object3 = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
        String object4 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
        String object5 = "<< /Length " + content.length + " >>\nstream\n" + new String(content, StandardCharsets.US_ASCII) + "\nendstream";
        return pdf(object1, object2, object3, object4, object5);
    }

    private byte[] pdf(String... objects) {
        StringBuilder builder = new StringBuilder("%PDF-1.4\n");
        List<Integer> offsets = new ArrayList<>();
        for (int i = 0; i < objects.length; i++) {
            offsets.add(builder.length());
            builder.append(i + 1).append(" 0 obj\n")
                    .append(objects[i])
                    .append("\nendobj\n");
        }
        int xref = builder.length();
        builder.append("xref\n0 ").append(objects.length + 1).append("\n");
        builder.append("0000000000 65535 f \n");
        for (Integer offset : offsets) {
            builder.append(String.format("%010d 00000 n \n", offset));
        }
        builder.append("trailer\n<< /Size ").append(objects.length + 1)
                .append(" /Root 1 0 R >>\nstartxref\n")
                .append(xref)
                .append("\n%%EOF\n");
        return builder.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private String money(BigDecimal value) {
        return "R$ " + value;
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replaceAll("[^\\x20-\\x7E]", "?");
    }
}
