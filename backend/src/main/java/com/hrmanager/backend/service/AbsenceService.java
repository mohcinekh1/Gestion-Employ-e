package com.hrmanager.backend.service;

import com.hrmanager.backend.dto.absence.AbsenceRequestDTO;
import com.hrmanager.backend.dto.absence.AbsenceRejectRequestDTO;
import com.hrmanager.backend.dto.absence.AbsenceResponseDTO;
import com.hrmanager.backend.entity.Absence;
import com.hrmanager.backend.entity.AbsenceStatus;
import com.hrmanager.backend.entity.AbsenceType;
import com.hrmanager.backend.entity.AppUser;
import com.hrmanager.backend.entity.Employee;
import com.hrmanager.backend.exception.BadRequestException;
import com.hrmanager.backend.exception.EntityNotFoundException;
import com.hrmanager.backend.repository.AbsenceRepository;
import com.hrmanager.backend.repository.AppUserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AbsenceService {
    private static final int DEFAULT_ANNUAL_BALANCE = 30;
    private final AbsenceRepository absenceRepository;
    private final EmployeeService employeeService;
    private final AppUserRepository appUserRepository;

    public AbsenceService(AbsenceRepository absenceRepository, EmployeeService employeeService, AppUserRepository appUserRepository) {
        this.absenceRepository = absenceRepository;
        this.employeeService = employeeService;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponseDTO> getAll() {
        if (canManageAllAbsences()) {
            return absenceRepository.findAll().stream().map(this::toDto).toList();
        }
        Long linkedId = linkedEmployeeIdOrNull();
        if (linkedId == null) {
            throw new AccessDeniedException("Compte sans fiche employé associée");
        }
        Employee employee = employeeService.getEntityById(linkedId);
        return absenceRepository.findByEmployeeOrderByStartDateDesc(employee).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponseDTO> getByEmployee(Long employeeId) {
        ensureEmployeeOwnsOrManageAll(employeeId);
        Employee employee = employeeService.getEntityById(employeeId);
        return absenceRepository.findByEmployeeOrderByStartDateDesc(employee).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponseDTO> getPendingAbsences() {
        return absenceRepository.findByStatus(AbsenceStatus.EN_ATTENTE).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AbsenceResponseDTO getById(Long id) {
        Absence absence = getEntityById(id);
        ensureOwnAbsenceOrManageAll(absence);
        return toDto(absence);
    }

    @Transactional
    public AbsenceResponseDTO create(AbsenceRequestDTO dto) {
        ensureEmployeeOwnsOrManageAll(dto.employeeId());
        validateDates(dto);
        validateBalanceAndOverlaps(dto, null);
        Absence absence = new Absence();
        apply(absence, dto);
        return toDto(absenceRepository.save(absence));
    }

    @Transactional
    public AbsenceResponseDTO update(Long id, AbsenceRequestDTO dto) {
        Absence absence = getEntityById(id);
        ensureOwnAbsenceOrManageAll(absence);
        if (!canManageAllAbsences()) {
            if (absence.getStatus() != AbsenceStatus.EN_ATTENTE) {
                throw new AccessDeniedException("Seules les demandes en attente sont modifiables.");
            }
            if (!dto.employeeId().equals(absence.getEmployee().getId())) {
                throw new BadRequestException("Réaffectation interdite");
            }
        }
        validateDates(dto);
        validateBalanceAndOverlaps(dto, id);
        apply(absence, dto);
        return toDto(absenceRepository.save(absence));
    }

    @Transactional
    public AbsenceResponseDTO approve(Long id) {
        Absence absence = getEntityById(id);
        if (absence.getStatus() != AbsenceStatus.EN_ATTENTE) {
            throw new BadRequestException("Only pending absences can be approved");
        }
        absence.setStatus(AbsenceStatus.APPROUVE);
        absence.setReviewedAt(LocalDateTime.now());
        absence.setReviewedBy(getCurrentUser());
        return toDto(absenceRepository.save(absence));
    }

    @Transactional
    public AbsenceResponseDTO reject(Long id, AbsenceRejectRequestDTO request) {
        Absence absence = getEntityById(id);
        if (absence.getStatus() != AbsenceStatus.EN_ATTENTE) {
            throw new BadRequestException("Only pending absences can be rejected");
        }
        absence.setStatus(AbsenceStatus.REFUSE);
        absence.setReviewedAt(LocalDateTime.now());
        absence.setReviewedBy(getCurrentUser());
        absence.setReason(request.reason());
        return toDto(absenceRepository.save(absence));
    }

    @Transactional(readOnly = true)
    public int getRemainingBalance(Long employeeId, int year) {
        ensureEmployeeOwnsOrManageAll(employeeId);
        Employee employee = employeeService.getEntityById(employeeId);
        List<Absence> approved = absenceRepository.findByEmployeeOrderByStartDateDesc(employee).stream()
                .filter(a -> a.getStatus() == AbsenceStatus.APPROUVE)
                .filter(a -> a.getStartDate().getYear() == year)
                .toList();
        int consumed = approved.stream()
                .mapToInt(a -> (int) calculateWorkingDays(a.getStartDate(), a.getEndDate()))
                .sum();
        return Math.max(0, DEFAULT_ANNUAL_BALANCE - consumed);
    }

    public long countPending() {
        return absenceRepository.findByStatus(AbsenceStatus.EN_ATTENTE).size();
    }

    public double getAbsenceRateThisMonth(long totalEmployees) {
        if (totalEmployees == 0) {
            return 0.0;
        }
        LocalDate now = LocalDate.now();
        long approvedThisMonth = absenceRepository.findAll().stream()
                .filter(a -> a.getStatus() == AbsenceStatus.APPROUVE)
                .filter(a -> a.getStartDate().getYear() == now.getYear())
                .filter(a -> a.getStartDate().getMonth() == now.getMonth())
                .count();
        return (approvedThisMonth * 100.0) / totalEmployees;
    }

    @Transactional
    public void delete(Long id) {
        Absence absence = getEntityById(id);
        ensureOwnAbsenceOrManageAll(absence);
        if (!canManageAllAbsences() && absence.getStatus() != AbsenceStatus.EN_ATTENTE) {
            throw new AccessDeniedException("Suppression réservée aux demandes en attente.");
        }
        absenceRepository.delete(absence);
    }

    private Absence getEntityById(Long id) {
        return absenceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence " + id + " not found"));
    }

    private void apply(Absence absence, AbsenceRequestDTO dto) {
        Employee employee = employeeService.getEntityById(dto.employeeId());
        absence.setEmployee(employee);
        absence.setStartDate(dto.startDate());
        absence.setEndDate(dto.endDate());
        absence.setType(AbsenceType.valueOf(dto.type().toUpperCase()));
        absence.setReason(dto.reason());
        if (absence.getStatus() == null) {
            absence.setStatus(AbsenceStatus.EN_ATTENTE);
        }
    }

    private void validateDates(AbsenceRequestDTO dto) {
        if (dto.endDate().isBefore(dto.startDate())) {
            throw new BadRequestException("endDate must be greater than or equal to startDate");
        }
    }

    private void validateBalanceAndOverlaps(AbsenceRequestDTO dto, Long currentAbsenceId) {
        Employee employee = employeeService.getEntityById(dto.employeeId());
        int requestedDays = (int) calculateWorkingDays(dto.startDate(), dto.endDate());
        AbsenceType type = AbsenceType.valueOf(dto.type().toUpperCase());
        /** Le quota annuel par défaut ne s’applique qu’aux congés payés (aligné métier RH). */
        if (type == AbsenceType.CONGE_PAYE) {
            int remaining = getRemainingBalance(employee.getId(), dto.startDate().getYear());
            if (requestedDays > remaining) {
                throw new BadRequestException("Insufficient absence balance");
            }
        }
        List<Absence> overlaps = absenceRepository.findOverlappingAbsences(
                employee,
                dto.startDate(),
                dto.endDate(),
                List.of(AbsenceStatus.EN_ATTENTE, AbsenceStatus.APPROUVE)
        );
        boolean hasRealOverlap = overlaps.stream().anyMatch(a -> currentAbsenceId == null || !a.getId().equals(currentAbsenceId));
        if (hasRealOverlap) {
            throw new BadRequestException("Absence overlaps with an existing request");
        }
    }

    private long calculateWorkingDays(LocalDate start, LocalDate end) {
        long count = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                count++;
            }
            current = current.plusDays(1);
        }
        return count;
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        String principal = authentication.getName();
        return appUserRepository.findByUsernameWithEmployee(principal).orElse(null);
    }

    private boolean canManageAllAbsences() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) {
            return false;
        }
        return a.getAuthorities().stream().anyMatch(gr ->
                "ROLE_ADMIN".equals(gr.getAuthority()) || "ROLE_MANAGER".equals(gr.getAuthority()));
    }

    private Long linkedEmployeeIdOrNull() {
        AppUser u = getCurrentUser();
        if (u == null || u.getEmployee() == null) {
            return null;
        }
        return u.getEmployee().getId();
    }

    private void ensureEmployeeOwnsOrManageAll(Long employeeId) {
        if (canManageAllAbsences()) {
            return;
        }
        Long linked = linkedEmployeeIdOrNull();
        if (linked == null || !linked.equals(employeeId)) {
            throw new AccessDeniedException("Accès non autorisé aux données de cet employé.");
        }
    }

    private void ensureOwnAbsenceOrManageAll(Absence absence) {
        if (canManageAllAbsences()) {
            return;
        }
        Long linked = linkedEmployeeIdOrNull();
        if (linked == null || !linked.equals(absence.getEmployee().getId())) {
            throw new AccessDeniedException("Accès non autorisé à cette demande.");
        }
    }

    private AbsenceResponseDTO toDto(Absence a) {
        String approvedByUsername = null;
        if (a.getReviewedBy() != null) {
            approvedByUsername = a.getReviewedBy().getUsername();
        }
        return new AbsenceResponseDTO(
                a.getId(),
                a.getEmployee().getId(),
                a.getEmployee().getFirstName() + " " + a.getEmployee().getLastName(),
                a.getStartDate(),
                a.getEndDate(),
                a.getType().name(),
                a.getStatus().name(),
                a.getReason(),
                a.getCreatedAt(),
                approvedByUsername
        );
    }
}
