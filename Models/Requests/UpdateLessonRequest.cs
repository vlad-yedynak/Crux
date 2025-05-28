using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Crux.Models.Entities;

namespace Crux.Models.Requests;

public class UpdateLessonRequest
{
    [Required]
    [JsonPropertyName("id")]
    public int Id { get; set; }
    
    [Required]
    [JsonPropertyName("title")]
    public required string Title { get; set; }
}
