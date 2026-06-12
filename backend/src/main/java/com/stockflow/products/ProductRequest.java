package com.stockflow.products;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 80) String sku,
        @Size(max = 120) String category,
        @Size(max = 1000) String description,
        @Size(max = 80) String barcode,
        @Size(max = 120) String referenceCode,
        @Size(max = 500)
        @Pattern(regexp = "^$|https?://.+", message = "URL da imagem deve começar com http:// ou https://")
        String imageUrl,
        @NotNull @DecimalMin("0.00") BigDecimal costPrice,
        @NotNull @DecimalMin("0.00") BigDecimal salePrice,
        @NotBlank @Size(max = 20) String unit,
        @NotNull @DecimalMin("0.000") BigDecimal stockQuantity,
        @NotNull @DecimalMin("0.000") BigDecimal minimumStock,
        Boolean active
) {
}
