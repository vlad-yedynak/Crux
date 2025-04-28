using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class CardRequest
{
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("title")]
    public required string Title { get; set; }
    
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("description")]
    public required string Description { get; set; }
    
    [Required]
    [JsonPropertyName("lessonId")]
    public int LessonId { get; set; }
    
    [Required]
    [JsonPropertyName("cardType")]
    public CardType CardType { get; set; }
    
    [Required]
    [MaxLength(1023)]
    [JsonPropertyName("content")]
    public string? Content { get; set; }
    
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("question")]
    public Question? Question { get; set; }
}
