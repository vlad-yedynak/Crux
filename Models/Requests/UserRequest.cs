using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class UserRequest
{
    [MaxLength(255)]
    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }
    
    [MaxLength(255)]
    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    [JsonPropertyName("email")]
    public required string Email { get; set; }
    
    [Required]
    [MinLength(8)]
    [MaxLength(255)]
    [JsonPropertyName("password")]
    public required string Password { get; set; }
}
