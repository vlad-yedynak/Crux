using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public abstract class Response
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    
    [JsonPropertyName("error")]
    public string? Error { get; set; }
}
