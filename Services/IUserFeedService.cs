using Crux.Models.Responses;

namespace Crux.Services;

public interface IUserFeedService
{
    Task<ICollection<UserFeedResponse>> GetUserFeedResourcesAsync(string detailedTopic, int numberOfResourcesToRequest = 3);
}
