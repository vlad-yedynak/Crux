using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class LessonRequest
{
    [JsonPropertyName("title")]
    [Required]
    public required string Title { get; set; }

    [JsonPropertyName("visibility")]
    public string Visibility { get; set; } = "Private";
}