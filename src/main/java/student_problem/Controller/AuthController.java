package student_problem.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin(origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
})
@RequestMapping("/api/auth")
public class AuthController {

    private static final Set<String> TOKENS = ConcurrentHashMap.newKeySet();

    private final String adminUser;
    private final String adminPass;

    public AuthController(@Value("${app.admin.username}") String adminUser,
                          @Value("${app.admin.password}") String adminPass) {
        this.adminUser = adminUser;
        this.adminPass = adminPass;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String user = body.getOrDefault("username", "");
        String pass = body.getOrDefault("password", "");

        if (adminUser.equals(user) && adminPass.equals(pass)) {
            String token = UUID.randomUUID().toString();
            TOKENS.add(token);
            return ResponseEntity.ok(Map.of("token", token));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (token != null) TOKENS.remove(token);
        return ResponseEntity.noContent().build();
    }

    public static boolean isValid(String token) {
        return token != null && TOKENS.contains(token);
    }
}