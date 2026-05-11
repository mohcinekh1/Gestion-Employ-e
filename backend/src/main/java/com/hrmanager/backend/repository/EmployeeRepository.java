package com.hrmanager.backend.repository;

import com.hrmanager.backend.entity.Department;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.entity.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    Optional<Employee> findByEmail(String email);
    List<Employee> findByDepartment(Department department);
    List<Employee> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);
    Page<Employee> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName, Pageable pageable);

    long countByStatus(EmployeeStatus status);

    @Query(value = "SELECT DATE_FORMAT(e.hire_date, '%Y-%m'), COUNT(e.id) FROM employees e GROUP BY DATE_FORMAT(e.hire_date, '%Y-%m') ORDER BY DATE_FORMAT(e.hire_date, '%Y-%m') DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> countHiresGroupedByMonthDesc(@Param("limit") int limit);

    @Query("SELECT d.name, COUNT(e) FROM Employee e JOIN e.department d GROUP BY d.name")
    List<Object[]> countByDepartment();

    @Query("SELECT e FROM Employee e ORDER BY e.hireDate DESC")
    Page<Employee> findRecentHires(Pageable pageable);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    long countByDepartmentId(@Param("departmentId") Long departmentId);
}
