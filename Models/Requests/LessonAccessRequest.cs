using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class LessonAccessRequest
{
    [Required]
    [JsonPropertyName("userId")]
    public List<int> UserIds { get; set; } = new List<int>();
    
    [Required]
    [JsonPropertyName("lessonId")]
    public int LessonId { get; set; }
    
    [JsonPropertyName("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}