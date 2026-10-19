package student_problem.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
})
@RequestMapping("/api/files")
public class FileController {

    private final Path uploadPath;

    public FileController(@Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadPath);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String original = Paths.get(file.getOriginalFilename()).getFileName().toString();
        String storedName = UUID.randomUUID() + "_" + original;

        Files.copy(file.getInputStream(),
                uploadPath.resolve(storedName),
                StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok(Map.of(
                "fileName", original,
                "filePath", storedName));
    }

    @GetMapping("/download/{storedName:.+}")
    public ResponseEntity<Resource> download(@PathVariable String storedName) throws IOException {
        Path file = uploadPath.resolve(storedName).normalize();

        if (!file.startsWith(uploadPath) || !Files.exists(file)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(file.toUri());
        String downloadName = storedName.substring(storedName.indexOf('_') + 1);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + downloadName + "\"")
                .body(resource);
    }
}