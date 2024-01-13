defmodule Golf.UsersFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Golf.Users` context.
  """

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        id: GolfWeb.Plugs.unique_session_id(),
        name: "alice"
      })
      |> Golf.Users.create_user()

    user
  end
end
