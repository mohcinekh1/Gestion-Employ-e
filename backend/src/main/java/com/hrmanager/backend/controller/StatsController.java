package com.hrmanager.backend.controller;

import com.hrmanager.backend.dto.stats.DashboardDTO;
import com.hrmanager.backend.dto.stats.MonthlyHireDTO;
import com.hrmanager.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "http://localhost:4200")
public class StatsController {
    private final DashboardService dashboardService;

    public StatsController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/recruitment")
    public ResponseEntity<List<MonthlyHireDTO>> recruitmentByMonth(
            @RequestParam(defaultValue = "6") int months
    ) {
        return ResponseEntity.ok(dashboardService.getMonthlyRecruitmentSeries(months));
    }
}
