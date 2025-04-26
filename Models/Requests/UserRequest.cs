using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class UserRequest
{
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("firstName")]
    public required string FirstName { get; set; }
    
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("lastName")]
    public required string LastName { get; set; }
    
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
