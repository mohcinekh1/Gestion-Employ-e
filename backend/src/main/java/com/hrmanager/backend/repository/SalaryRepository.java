package com.hrmanager.backend.repository;

import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface SalaryRepository extends JpaRepository<Salary, Long> {
    List<Salary> findByEmployee(Employee employee);
    List<Salary> findByEmployeeOrderByEffectiveDateDesc(Employee employee);
    Optional<Salary> findTopByEmployeeOrderByEffectiveDateDesc(Employee employee);

    @Query("""
            SELECT COALESCE(SUM(s.amount), 0)
            FROM Salary s
            WHERE s.employee.department.id = :departmentId
            AND s.id IN (
                SELECT MAX(s2.id)
                FROM Salary s2
                WHERE s2.employee.department.id = :departmentId
                GROUP BY s2.employee.id
            )
            """)
    BigDecimal getDepartmentSalaryMass(@Param("departmentId") Long departmentId);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Salary s")
    BigDecimal getTotalSalaryMass();

    @Query("SELECT COALESCE(AVG(s.amount), 0) FROM Salary s")
    Double getAverageSalary();
}
