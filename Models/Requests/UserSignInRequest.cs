using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class UserSignUpRequest : UserSignInRequest
{
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("firstName")]
    public required string FirstName { get; set; }
    
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("lastName")]
    public required string LastName { get; set; }
}