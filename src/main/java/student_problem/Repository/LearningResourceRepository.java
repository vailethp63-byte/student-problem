package student_problem.Repository;

import student_problem.Entity.LearningResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningResourceRepository
        extends JpaRepository<LearningResource, Long> {

    List<LearningResource> findByTitleContainingIgnoreCase(String title);

    List<LearningResource> findByResourceTypeIgnoreCase(String resourceType);

    List<LearningResource> findByCourseNameContainingIgnoreCase(String courseName);
}