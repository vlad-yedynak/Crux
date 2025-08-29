using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class LessonRevokeRequest
{
    [Required]
    [JsonPropertyName("userIds")]
    public required List<int> UserIds { get; set; }

    [Required]
    [JsonPropertyName("lessonId")]
    public int LessonId { get; set; }

    [JsonPropertyName("banReason")]
    [MaxLength(256)]
    public string? BanReason { get; set; }
}