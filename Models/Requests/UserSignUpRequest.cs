using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class UserSignInRequest
{
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