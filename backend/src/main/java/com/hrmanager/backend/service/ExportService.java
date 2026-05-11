package com.hrmanager.backend.service;

import com.hrmanager.backend.entity.Employee;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ExportService {

    public ByteArrayInputStream exportEmployeesToExcel(List<Employee> employees) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Employees");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("ID");
            header.createCell(1).setCellValue("First Name");
            header.createCell(2).setCellValue("Last Name");
            header.createCell(3).setCellValue("Email");
            header.createCell(4).setCellValue("Department");
            header.createCell(5).setCellValue("Status");

            int rowIdx = 1;
            for (Employee employee : employees) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(employee.getId());
                row.createCell(1).setCellValue(employee.getFirstName());
                row.createCell(2).setCellValue(employee.getLastName());
                row.createCell(3).setCellValue(employee.getEmail());
                row.createCell(4).setCellValue(employee.getDepartment().getName());
                row.createCell(5).setCellValue(employee.getStatus().name());
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export employees to Excel", e);
        }
    }

    public ByteArrayInputStream exportEmployeesToCsv(List<Employee> employees) {
        StringBuilder builder = new StringBuilder("id;firstName;lastName;email;department;status\n");
        for (Employee employee : employees) {
            builder.append(employee.getId()).append(';')
                    .append(employee.getFirstName()).append(';')
                    .append(employee.getLastName()).append(';')
                    .append(employee.getEmail()).append(';')
                    .append(employee.getDepartment().getName()).append(';')
                    .append(employee.getStatus().name())
                    .append('\n');
        }
        return new ByteArrayInputStream(builder.toString().getBytes(StandardCharsets.UTF_8));
    }
}
