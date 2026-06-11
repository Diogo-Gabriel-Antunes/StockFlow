package com.stockflow.publicquotes;

public record QuotePdfResponse(byte[] content, String filename) {
}
