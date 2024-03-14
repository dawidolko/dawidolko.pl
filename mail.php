<?php
// Włączanie raportowania błędów dla debugowania, wyłącz w środowisku produkcyjnym
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *'); // Dla zapytań CORS, zastąp '*' rzeczywistą domeną, jeśli to konieczne
header('Content-Type: text/plain; charset=utf-8'); // Ustaw odpowiedni typ zawartości

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $subject = strip_tags(trim($_POST["subject"]));
    $message = trim($_POST["message"]);

    // Walidacja wejścia
    if (empty($name) || empty($subject) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Ustawienie kodu odpowiedzi na 400 i wyjście z błędem
        http_response_code(400);
        echo "Please complete the form and try again.";
        exit;
    }

    // Odbiorca wiadomości
    $recipient = "poczta@dawidolko.pl";
    
    // Budowa treści wiadomości
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";

    // Budowa nagłówków e-mail
    $email_headers = "From: $name <$email>";

    // Wysyłanie wiadomości
    if (mail($recipient, $subject, $email_content, $email_headers)) {
        http_response_code(200);
        echo "Thank You! Your message has been sent.";
    } else {
        http_response_code(500);
        echo "Oops! Something went wrong and we couldn't send your message.";
    }
} else {
    // Nieprawidłowa metoda żądania
    http_response_code(403);
    echo "There was a problem with your submission, please try again.";
}
?>
