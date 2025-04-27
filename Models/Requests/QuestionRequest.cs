using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;


namespace Crux.Models.Requests;

public class QuestionRequest
{
    
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [Required]
    [JsonPropertyName("testCardId")]
    public int TestCardId { get; set; }

    [Required]
    [JsonPropertyName("questionText")]
    [MaxLength(255)]
    public required string QuestionText { get; set; }
    
    [Required]
    [JsonPropertyName("answers")]
    public ICollection<AnswerRequest> Answers { get; set; } = new List<AnswerRequest>();
}
