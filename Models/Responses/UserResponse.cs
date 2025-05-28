using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class UserResponse : Response
{
    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }
    
    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }
    
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    
    [JsonPropertyName("avatar")]
    public string? AvatarUrl { get; set; }
    
    [JsonPropertyName("scorePoints")]
    public Dictionary<int, int>? ScorePoints { get; set; }
    
    [JsonPropertyName("userRole")]
    public string? UserRole { get; set; }
}
