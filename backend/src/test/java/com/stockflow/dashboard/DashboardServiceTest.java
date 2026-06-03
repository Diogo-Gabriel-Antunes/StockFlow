package com.stockflow.dashboard;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class DashboardServiceTest {

    @Test
    void calculatesApprovalRate() {
        DashboardService service = new DashboardService();

        assertEquals(new BigDecimal("50.00"), service.approvalRate(4, 2));
        assertEquals(new BigDecimal("0.00"), service.approvalRate(0, 0));
    }
}
