using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class AuthResponse : IResponse
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }
}
