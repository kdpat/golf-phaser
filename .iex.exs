alias Golf.Users.User
alias Golf.{Games, GamesDb}
alias Golf.Games.{Game, Player}

{:ok, user0} =
  Golf.Users.create_user(%{
    session_id: GolfWeb.Plugs.unique_session_id(),
    name: "alice"
  })
