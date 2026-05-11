package com.hrmanager.backend.repository;

import com.hrmanager.backend.entity.Absence;
import com.hrmanager.backend.entity.AbsenceStatus;
import com.hrmanager.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AbsenceRepository extends JpaRepository<Absence, Long> {
    List<Absence> findByEmployee(Employee employee);
    List<Absence> findByEmployeeOrderByStartDateDesc(Employee employee);
    List<Absence> findByStatus(AbsenceStatus status);

    @Query("""
            SELECT a FROM Absence a
            WHERE a.employee = :employee
              AND a.status IN :statuses
              AND a.startDate <= :endDate
              AND a.endDate >= :startDate
            """)
    List<Absence> findOverlappingAbsences(
            @Param("employee") Employee employee,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<AbsenceStatus> statuses
    );

    @Query("""
            SELECT a FROM Absence a
            WHERE a.status = 'APPROUVE'
              AND YEAR(a.startDate) = :year
            """)
    List<Absence> findApprovedByYear(@Param("year") int year);
}
