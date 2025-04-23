using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class AuthResponse : Response
{
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }
}
