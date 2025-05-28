using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Crux.Models.Requests;

public class ValidateQuestionRequest
{
    [Required]
    [JsonPropertyName("questionId")]
    public required int QuestionId { get; set; }
    
    [Required]
    [JsonPropertyName("answerId")]
    public required int AnswerId { get; set; }
}