using Crux.Models.Responses;

namespace Crux.Services;

public interface IUserFeedService
{
    Task<ICollection<UserFeedResponse>> GetLearningResourcesAsync(string detailedTopic, int numberOfResourcesToRequest = 3);
}
