using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class CardResponse : Response
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
    
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    
    [JsonPropertyName("questions")]
    public ICollection<QuestionResponse>? Questions { get; set; }
}
