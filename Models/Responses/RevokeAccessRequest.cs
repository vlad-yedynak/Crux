using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class RevokeAccessRequest
{
    [JsonPropertyName("userId")]
    [Required]
    public int UserId { get; set; }
    
    [JsonPropertyName("lessonId")]
    [Required]
    public int LessonId { get; set; }
}