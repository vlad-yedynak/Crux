using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class QuestionResponse : Response
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }
    
    [JsonPropertyName("questionText")]
    public string? QuestionText { get; set; }
    
    [JsonPropertyName("answers")]
    public ICollection<AnswerResponse>? Answers { get; set; }
    
    [JsonPropertyName("isCompleted")]
    public bool? IsCompleted { get; set; }
}
