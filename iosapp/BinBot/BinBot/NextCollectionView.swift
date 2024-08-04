//
//  NextCollectionView.swift
//  BinBot
//
//  Created by Sbeve on 04/08/2024.
//

import SwiftUI

struct NextCollectionVew: View {
    @Binding var UserId: String
    @Environment(\.colorScheme) var colorScheme
    var body: some View {
        NavigationView {
            VStack {
                Image("header")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 250)
                    .foregroundStyle(.tint)
                    .padding(.top, 5)
                Spacer()
                
                
                HStack {
                    ZStack {
                        RoundedRectangle(cornerRadius: 15)
                            .fill(.cardColour)
                            HStack(alignment: .top) {
                                VStack(alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/) {
                                    Text("31st")
                                        .font(.system(size: 30))
                                    Text("November")
                                        .font(.system(size: 25 ))
                                }
                            }
                    }
                    Spacer().frame(width: 20)
                    ZStack {
                        RoundedRectangle(cornerRadius: 15)
                            .fill(.cardColour)
                            HStack(alignment: .top) {
                                VStack(alignment: /*@START_MENU_TOKEN@*/.center/*@END_MENU_TOKEN@*/) {
                                    Text("03")
                                        .font(.system(size: 30))
                                    Text("Days")
                                        .font(.system(size: 25 ))
                                }
                            }
                    }

                }
                .padding(.top)
                .padding(.trailing)
                .padding(.leading)
                .padding(.bottom, 10.0)
                                
                
                ZStack {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(.cardColour)
                    
                    VStack(alignment :.leading) {
                        
                        HStack {
                            Image("bin-food")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 60)
                                .padding(.trailing, 10)
                            Text("Food Waste")
                        }
                        .padding(.bottom, 5)
                        HStack {
                            Image("bin-garden")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 60)
                                .padding(.trailing, 10)
                            Text("Garden Waste")
                        }
                        .padding(.bottom, 5)
                        HStack {
                            Image("bin-recyle")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 60)
                                .padding(.trailing, 10)
                            Text("Recyling")
                        }
                        .padding(.bottom, 5)
                        HStack {
                            Image("bin-general")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 60)
                                .padding(.trailing, 10)
                            Text("Household Waste")
                        }
                        .padding(.bottom, 5)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(20)
                    .multilineTextAlignment(.center)
                }
                .padding(.trailing)
                .padding(.leading)
                .padding(.bottom)
            }
            .padding(.trailing)
            .padding(.leading)
            .padding(.bottom)
            .navigationTitle(Text("Your Next Collection"))
                
        }
        
        
    }
}

#Preview {
    BaseView()
}
