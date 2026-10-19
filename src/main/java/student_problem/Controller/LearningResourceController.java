package student_problem.Controller;

import jakarta.validation.Valid;
import student_problem.Entity.LearningResource;
import student_problem.Repository.LearningResourceRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
})
@RequestMapping("/api/resources")
public class LearningResourceController {

    private final LearningResourceRepository repository;

    public LearningResourceController(LearningResourceRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<LearningResource> getAllResources() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningResource> getResourceById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<LearningResource> searchByTitle(@RequestParam String title) {
        return repository.findByTitleContainingIgnoreCase(title);
    }

    @GetMapping("/type/{resourceType}")
    public List<LearningResource> getByType(@PathVariable String resourceType) {
        return repository.findByResourceTypeIgnoreCase(resourceType);
    }

    @GetMapping("/course")
    public List<LearningResource> getByCourse(@RequestParam String name) {
        return repository.findByCourseNameContainingIgnoreCase(name);
    }

    @PostMapping
    public ResponseEntity<LearningResource> createResource(
            @Valid @RequestBody LearningResource resource) {
        LearningResource saved = repository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LearningResource> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody LearningResource updated,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {

        if (!AuthController.isValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return repository.findById(id)
                .map(existing -> {
                    existing.setTitle(updated.getTitle());
                    existing.setDescription(updated.getDescription());
                    existing.setResourceType(updated.getResourceType());
                    existing.setCourseName(updated.getCourseName());
                    existing.setAcademicYear(updated.getAcademicYear());
                    existing.setFileName(updated.getFileName());
                    existing.setFilePath(updated.getFilePath());
                    existing.setUploadedBy(updated.getUploadedBy());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {

        if (!AuthController.isValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}