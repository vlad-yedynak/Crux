using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Crux.Models.EntityTypes;

namespace Crux.Models.Requests;

public class CardRequest
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
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
    public required int LessonId { get; set; }
    
    [Required]
    [JsonPropertyName("cardType")]
    public required string CardType { get; set; }
    
    [JsonPropertyName("sandBoxCardType")]
    public string? SandBoxCardType { get; set; }
    
}
