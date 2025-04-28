using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class AnswerRequest
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [Required]
    [JsonPropertyName("answerText")]
    [MaxLength(255)]
    public required string AnswerText { get; set; }
    
    [Required]
    [JsonPropertyName("isCorrect")]
    public bool IsCorrect { get; set; }
}
