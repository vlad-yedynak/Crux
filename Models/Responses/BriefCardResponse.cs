using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class BriefCardResponse : Response
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [MaxLength(255)]
    [JsonPropertyName("title")]
    public string? Title { get; set; }
    
    [MaxLength(255)]
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    
    [JsonPropertyName("lessonId")]
    public int? LessonId { get; set; }
    
    [JsonPropertyName("type")]
    public CardType? CardType { get; set; }
}