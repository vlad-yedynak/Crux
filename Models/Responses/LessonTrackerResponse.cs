using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class LessonTrackerResponse : Response
{
    [JsonPropertyName("trackedTime")]
    public double? TrackedTime { get; set; }
}
