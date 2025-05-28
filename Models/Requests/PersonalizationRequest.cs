using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class PersonalizationRequest
{
    [Required]
    [JsonPropertyName("userId")]
    public required int UserId { get; set; }
    
    [Required]
    [JsonPropertyName("lessonId")]
    public required int LessonId { get; set; }
    
    [Required]
    [JsonPropertyName("trackedTime")]
    public required double TrackedTime { get; set; }
}
