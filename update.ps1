$url = "https://bmasldizsbbgvrrdsfek.supabase.co/rest/v1/products%20for%20Gorosei?id=eq.1"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw"
$body = '{"sold":false}'

$w = [System.Net.WebRequest]::Create($url)
$w.Method = "PATCH"
$w.Headers["apikey"] = $key
$w.ContentType = "application/json"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$w.GetRequestStream().Write($bytes, 0, $bytes.Length)
$w.GetResponse() | Out-Null
Write-Host "Updated!"