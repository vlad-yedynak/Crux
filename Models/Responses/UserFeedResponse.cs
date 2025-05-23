namespace Crux.Models.Responses;

public class UserFeedResponse : Response
{
    public required string Title { get; set; }
    
    public required string Url { get; set; }
    
    public required string? Description { get; set; }
    
    public required string Thumbnail { get; set; }
}

// TODO: implement this response to suit content found by AI service
