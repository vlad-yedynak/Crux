using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class GrantAccessRequest
{
    [JsonPropertyName("userId")]
    [Required]
    public int UserId { get; set; }
    
    [JsonPropertyName("lessonId")]
    [Required]
    public int LessonId { get; set; }
    
    [JsonPropertyName("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}